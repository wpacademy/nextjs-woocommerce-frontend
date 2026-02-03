const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface GraphQLFetchOptions {
  revalidate?: number | false;
  tags?: string[];
}

class GraphQLError extends Error {
  errors: Array<{ message: string }>;

  constructor(errors: Array<{ message: string }>) {
    super(errors[0]?.message || 'GraphQL Error');
    this.name = 'GraphQLError';
    this.errors = errors;
  }
}

/**
 * Execute a GraphQL query
 */
export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphQLFetchOptions
): Promise<T> {
  if (!GRAPHQL_URL) {
    throw new Error('NEXT_PUBLIC_GRAPHQL_URL is not configured');
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    next: {
      revalidate: options?.revalidate ?? 60,
      tags: options?.tags,
    },
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP Error: ${response.status} ${response.statusText}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors?.length) {
    throw new GraphQLError(json.errors);
  }

  return json.data;
}

// Types
export interface MenuItem {
  id: string;
  label: string;
  url: string;
  path: string;
  parentId: string | null;
  target: string | null;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  slug: string;
  menuItems: {
    nodes: MenuItem[];
  };
}

export interface Page {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: {
    node: {
      sourceUrl: string;
      altText: string;
      mediaDetails: {
        width: number;
        height: number;
      };
    };
  } | null;
  seo?: {
    title: string;
    metaDesc: string;
  };
}

export interface MediaItem {
  id: string;
  sourceUrl: string;
  altText: string;
  mediaDetails: {
    width: number;
    height: number;
  };
}

// Queries

/**
 * Get all menus
 */
export async function getMenus(): Promise<Menu[]> {
  const data = await graphqlFetch<{ menus: { nodes: Menu[] } }>(
    `
    query GetMenus {
      menus {
        nodes {
          id
          name
          slug
          menuItems(first: 100) {
            nodes {
              id
              label
              url
              path
              parentId
              target
            }
          }
        }
      }
    }
    `,
    undefined,
    { revalidate: 300 }
  );

  return data.menus.nodes;
}

/**
 * Get a menu by slug or location
 */
export async function getMenuBySlug(slug: string): Promise<Menu | null> {
  const data = await graphqlFetch<{ menu: Menu | null }>(
    `
    query GetMenuBySlug($slug: ID!) {
      menu(id: $slug, idType: SLUG) {
        id
        name
        slug
        menuItems(first: 100) {
          nodes {
            id
            label
            url
            path
            parentId
            target
          }
        }
      }
    }
    `,
    { slug },
    { revalidate: 300 }
  );

  return data.menu;
}

/**
 * Build nested menu structure from flat list
 */
export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<string, MenuItem>();
  const rootItems: MenuItem[] = [];

  // First pass: create map of all items
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build tree
  items.forEach((item) => {
    const currentItem = itemMap.get(item.id)!;

    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(currentItem);
      } else {
        rootItems.push(currentItem);
      }
    } else {
      rootItems.push(currentItem);
    }
  });

  return rootItems;
}

/**
 * Get all pages
 */
export async function getPages(): Promise<Page[]> {
  const data = await graphqlFetch<{ pages: { nodes: Page[] } }>(
    `
    query GetPages {
      pages(first: 100, where: { status: PUBLISH }) {
        nodes {
          id
          databaseId
          title
          slug
          content
          date
          modified
          featuredImage {
            node {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
          }
        }
      }
    }
    `,
    undefined,
    { revalidate: 300 }
  );

  return data.pages.nodes;
}

/**
 * Get a page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const data = await graphqlFetch<{ page: Page | null }>(
    `
    query GetPageBySlug($slug: ID!) {
      page(id: $slug, idType: URI) {
        id
        databaseId
        title
        slug
        content
        date
        modified
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
    `,
    { slug },
    { revalidate: 60 }
  );

  return data.page;
}

/**
 * Get site settings (general settings)
 */
export async function getSiteSettings(): Promise<{
  title: string;
  description: string;
  url: string;
}> {
  const data = await graphqlFetch<{
    generalSettings: {
      title: string;
      description: string;
      url: string;
    };
  }>(
    `
    query GetSiteSettings {
      generalSettings {
        title
        description
        url
      }
    }
    `,
    undefined,
    { revalidate: 3600 }
  );

  return data.generalSettings;
}

export { GraphQLError };
