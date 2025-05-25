/**
 * Configuration for the OpenAPI client
 */
const OpenAPI = {
  /**
   * Base URL for API requests
   */
  BASE: '',
  
  /**
   * Token provider function
   */
  TOKEN: async (): Promise<string | undefined> => {
    return localStorage.getItem('access_token') || undefined;
  }
}

export default OpenAPI;
