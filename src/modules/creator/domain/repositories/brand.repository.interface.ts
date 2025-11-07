import { Brand } from '../entities/brand.entity';

/**
 * Brand repository interface (domain layer)
 */
export interface IBrandRepository {
  /**
   * Find brand by ID
   */
  findById(id: string): Promise<Brand | null>;

  /**
   * Find all brands with pagination
   */
  findAll(limit: number, offset: number): Promise<Brand[]>;

  /**
   * Find brands by type
   */
  findByType(type: string, limit: number, offset: number): Promise<Brand[]>;

  /**
   * Save brand (create or update)
   */
  save(brand: Brand): Promise<Brand>;

  /**
   * Delete brand
   */
  delete(id: string): Promise<void>;
}

