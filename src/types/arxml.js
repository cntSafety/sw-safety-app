/**
 * Interface for ARXML file data.
 */
export interface ArxmlFile {
  id: string;
  name: string;
  content: string;
  parsedContent: any;
}

/**
 * Interface for ARXML tree node structure.
 */
export interface ArxmlTreeNode {
  key: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children?: ArxmlTreeNode[];
  isLeaf?: boolean;
}

/**
 * Interface for parsed ARXML node.
 */
export interface ArxmlNode {
  nodeName: string;
  attributes: Record<string, string>;
  children: ArxmlNode[];
  textContent?: string;
}
