/**
 * Define o tipo de um campo de propriedade.
 * 'text': Campo de texto livre.
 * 'select': Campo de seleção com opções pré-definidas.
 */
export type PropertyType = 'text' | 'select';

/**
 * Define a estrutura de uma propriedade customizável.
 */
export interface PropertyDefinition {
  id: string; // ID único, ex: 'marca'
  name: string; // Nome exibido na UI, ex: 'Marca'
  type: PropertyType;
  options?: string[]; // Lista de opções se o tipo for 'select'
}

/**
 * Representa um item no estoque, agora com propriedades dinâmicas.
 */
export interface StockItem {
  id: number;
  quantity: number;
  // Armazena os valores das propriedades, usando o ID da propriedade como chave.
  // ex: { marca: 'Marca Fina', cor: 'Azul' }
  properties: Record<string, string>; 
}
