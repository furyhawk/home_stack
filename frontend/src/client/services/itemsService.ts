import { 
  itemsReadItems,
  itemsCreateItem,
  itemsDeleteItem,
  itemsReadItem,
  itemsUpdateItem
} from '../sdk.gen';

/**
 * ItemsService provides an object-oriented interface to the items-related APIs
 */
class ItemsService {
  /**
   * Get list of items
   * 
   * @param skip Number of items to skip
   * @param limit Max number of items to return
   * @returns Promise with the items
   */
  static async readItems({ skip, limit }: { skip?: number, limit?: number } = {}) {
    return await itemsReadItems({
      params: {
        skip,
        limit
      }
    });
  }

  /**
   * Create a new item
   * 
   * @param requestBody Item data to create
   * @returns Promise with the created item
   */
  static async createItem({ requestBody }: { requestBody: any }) {
    return await itemsCreateItem({
      data: requestBody
    });
  }

  /**
   * Delete an item
   * 
   * @param id Item ID to delete
   * @returns Promise with the deletion result
   */
  static async deleteItem({ id }: { id: string }) {
    return await itemsDeleteItem({
      params: {
        id
      }
    });
  }

  /**
   * Get a specific item by ID
   * 
   * @param id Item ID to retrieve
   * @returns Promise with the item data
   */
  static async readItem({ id }: { id: string }) {
    return await itemsReadItem({
      params: {
        id
      }
    });
  }

  /**
   * Update an existing item
   * 
   * @param id Item ID to update
   * @param requestBody Item data to update
   * @returns Promise with the updated item
   */
  static async updateItem({ id, requestBody }: { id: string, requestBody: any }) {
    return await itemsUpdateItem({
      params: {
        id
      },
      data: requestBody
    });
  }
}

export default ItemsService;
