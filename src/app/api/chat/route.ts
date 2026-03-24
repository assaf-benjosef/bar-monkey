import { google } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import { addInventoryItem, decreaseInventoryItem, removeInventoryItem, getAllInventory } from '@/lib/db';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'), // or gemini-2.5-pro
    system: `You are Bar Monkey, an AI bartender assistant with a fun, upbeat personality. 
You are embedded in a home bar inventory application.
The user's name is Assaf. Address them warmly.
Always be enthusiastic and suggest fun drinks when appropriate.
Use the provided tools to manage the user's home bar inventory.
If the user tells you they bought something, add it to the inventory and assign an appropriate unit (e.g., 'ml' for spirits, 'dashes' for bitters, 'units' for garnishes, 'bottles' for wine/beer).
If they made a drink, decrease the ingredients used from the inventory. **CRITICALLY IMPORTANT:** You must ALWAYS perform unit conversions if necessary! For example, if a drink uses 1.5 oz of Whiskey but the database holds Whiskey in 'ml', you must convert 1.5 oz to 44 ml and subtract 44. Do NOT subtract 1.5 from 750ml!
If they ask what they can make, read the inventory and suggest a recipe using ONLY what they have.`,
    messages: await convertToModelMessages(messages),
    tools: {
      getInventory: tool({
        description: 'Read the current inventory of the home bar.',
        inputSchema: z.object({}),
        execute: async () => {
          const items = await getAllInventory();
          return { items };
        },
      }),
      addToInventory: tool({
        description: 'Add or restock an item in the home bar.',
        inputSchema: z.object({
          itemName: z.string().describe('The name of the item (e.g., "Gin", "Limes")'),
          category: z.string().describe('The category (e.g., "Spirit", "Mixer", "Garnish", "Wine", "Beer")'),
          quantity: z.number().default(1).describe('The quantity to add'),
          unit: z.string().default('units').describe('The unit of measurement (e.g., "ml", "oz", "dashes", "units", "bottles")'),
        }),
        execute: async ({ itemName, category, quantity, unit }) => {
          await addInventoryItem(itemName, category, quantity, unit);
          return { success: true, message: `Added ${quantity} ${unit} of ${itemName} to inventory.` };
        },
      }),
      decreaseFromInventory: tool({
        description: 'Decrease the quantity of an item from the home bar (e.g., when a bottle is finished or an ingredient is used up).',
        inputSchema: z.object({
          itemName: z.string().describe('The name of the item to decrease'),
          quantity: z.number().default(1).describe('The quantity to decrease by'),
        }),
        execute: async ({ itemName, quantity }) => {
          await decreaseInventoryItem(itemName, quantity);
          return { success: true, message: `Decreased ${itemName} by ${quantity}.` };
        },
      }),
      removeFromInventory: tool({
        description: 'Completely remove an item from the inventory.',
        inputSchema: z.object({
          itemName: z.string().describe('The name of the item to remove'),
        }),
        execute: async ({ itemName }) => {
          await removeInventoryItem(itemName);
          return { success: true, message: `Removed ${itemName} from inventory.` };
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
