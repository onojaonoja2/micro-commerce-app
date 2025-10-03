require('dotenv').config();
const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const db = sqlite3(dbPath);

try {
  // 1) Find duplicate cart_id+product_id groups
  const duplicates = db.prepare(`
    SELECT cart_id, product_id, SUM(quantity) as total_qty, COUNT(*) as cnt
    FROM cart_items
    GROUP BY cart_id, product_id
    HAVING cnt > 1
  `).all();

  if (duplicates.length) {
    console.log(`Found ${duplicates.length} duplicate cart item groups — consolidating...`);
    const mergeTxn = db.transaction((groups) => {
      const delStmt = db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?');
      const insertStmt = db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)');
      const stockStmt = db.prepare('SELECT stock FROM products WHERE id = ?');

      groups.forEach(g => {
        const cartId = g.cart_id;
        const productId = g.product_id;
        const summed = Number(g.total_qty) || 0;

        // Cap to available stock if product exists; otherwise keep summed quantity
        const prod = stockStmt.get(productId);
        const stock = prod ? Number(prod.stock) : null;
        const finalQty = (stock !== null && !Number.isNaN(stock)) ? Math.min(summed, stock) : summed;

        // Delete existing rows and insert consolidated one
        delStmt.run(cartId, productId);
        insertStmt.run(cartId, productId, finalQty);

        if (finalQty < summed) {
          console.warn(`Merged cart ${cartId}, product ${productId}: summed ${summed} -> capped ${finalQty} due to stock (${stock})`);
        }
      });
    });

    mergeTxn(duplicates);
    console.log('Duplicate consolidation complete.');
  } else {
    console.log('No duplicate cart items found.');
  }

  // 2) Create unique index (idempotent)
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_product ON cart_items(cart_id, product_id);');
  console.log('Migration applied: idx_cart_product created (or already existed)');
  process.exit(0);
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  try { db.close(); } catch (_) {}
}
