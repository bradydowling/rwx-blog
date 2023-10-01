type GatsbyActions = {
  createTypes: (typeDefs: string) => void;
};

export const createSchemaCustomization = ({ actions }: { actions: GatsbyActions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type MarkdownRemarkFrontmatter {
      socialImage: File @link(by: "relativePath")
    }
  `;
  createTypes(typeDefs);
};
