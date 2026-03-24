import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing Turso database credentials in environment");
}

export const db = createClient({
  url,
  authToken,
});

// Since the server runtime initializes once, we can just enforce the table schema here
db.execute(`
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'units'
  )
`).catch(console.error);

export interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const result = await db.execute('SELECT * FROM inventory ORDER BY category, item_name');
  return result.rows as unknown as InventoryItem[];
}

export async function addInventoryItem(itemName: string, category: string, quantity: number = 1, unit: string = 'units') {
  await db.execute({
    sql: `
      INSERT INTO inventory (item_name, category, quantity, unit)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(item_name) DO UPDATE SET quantity = quantity + excluded.quantity, unit = excluded.unit
    `,
    args: [itemName, category, quantity, unit]
  });
}

export async function decreaseInventoryItem(itemName: string, quantity: number = 1) {
  await db.execute({
    sql: `
      UPDATE inventory 
      SET quantity = MAX(0, quantity - ?) 
      WHERE item_name = ?
    `,
    args: [quantity, itemName]
  });
}

export async function removeInventoryItem(itemName: string) {
  await db.execute({
    sql: `DELETE FROM inventory WHERE item_name = ?`,
    args: [itemName]
  });
}
