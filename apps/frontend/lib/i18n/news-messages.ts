import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.news.title": "Новости",
  "meta.news.description":
    "Новости и обновления Spliton: продукт, выплаты USDT (TRC20) и вторичный рынок.",

  "news.hero.title": "Новости",
  "news.hero.subtitle": "Лента обновлений платформы — продукт, рынок, выплаты и документы.",
  "news.breadcrumb": "Узнать больше",
  "news.breadcrumbBlog": "Блог",
  "news.searchPlaceholder": "Поиск статей",
  "news.blogTitle": "Блог",
  "news.blogSubtitle": "Обновления продукта, рынка и выплат Spliton.",
  "news.error.live": "Не удалось загрузить новости. Сервис временно недоступен.",
  "news.error.demo": "Не удалось загрузить новости. Попробуйте обновить страницу.",
  "news.retry": "Повторить",
  "news.detail.error.load": "Не удалось загрузить статью. Сервис временно недоступен.",
  "news.detail.error.backToList": "К списку новостей",
  "news.empty.title": "Ничего не найдено",
  "news.empty.searchHint": "Попробуйте другой запрос или сбросьте фильтр категории.",
  "news.empty.categoryHint": "Пока нет опубликованных материалов в этой категории.",
  "news.empty.resetFilters": "Сбросить фильтры",
  "news.list.aria": "Публикации",

  "news.category.all": "Все",
  "news.category.product": "Продукт",
  "news.category.market": "Рынок",
  "news.category.payouts": "Выплаты",
  "news.category.legal": "Документы",

  "news.pagination.prev": "Предыдущая страница",
  "news.pagination.next": "Следующая страница",
  "news.pagination.page": "Страница {page} из {total}",
};

const EN: Record<string, string> = {
  "meta.news.title": "News",
  "meta.news.description":
    "Spliton news and updates: product, USDT (TRC20) payouts, and secondary market.",

  "news.hero.title": "News",
  "news.hero.subtitle": "Platform updates — product, market, payouts, and documents.",
  "news.breadcrumb": "Learn more",
  "news.breadcrumbBlog": "Blog",
  "news.searchPlaceholder": "Search articles",
  "news.blogTitle": "Blog",
  "news.blogSubtitle": "Spliton product, market, and payout updates.",
  "news.error.live": "Could not load news. The service is temporarily unavailable.",
  "news.error.demo": "Could not load news. Try refreshing the page.",
  "news.retry": "Retry",
  "news.detail.error.load": "Could not load this article. The service is temporarily unavailable.",
  "news.detail.error.backToList": "Back to news",
  "news.empty.title": "Nothing found",
  "news.empty.searchHint": "Try a different query or reset the category filter.",
  "news.empty.categoryHint": "No published articles in this category yet.",
  "news.empty.resetFilters": "Reset filters",
  "news.list.aria": "Articles",

  "news.category.all": "All",
  "news.category.product": "Product",
  "news.category.market": "Market",
  "news.category.payouts": "Payouts",
  "news.category.legal": "Documents",

  "news.pagination.prev": "Previous page",
  "news.pagination.next": "Next page",
  "news.pagination.page": "Page {page} of {total}",
};

const ES: Record<string, string> = {
  "meta.news.title": "Noticias",
  "meta.news.description":
    "Noticias y actualizaciones de Spliton: producto, pagos USDT (TRC20) y mercado secundario.",

  "news.hero.title": "Noticias",
  "news.hero.subtitle": "Actualizaciones de la plataforma — producto, mercado, pagos y documentos.",
  "news.breadcrumb": "Saber más",
  "news.breadcrumbBlog": "Blog",
  "news.searchPlaceholder": "Buscar artículos",
  "news.blogTitle": "Blog",
  "news.blogSubtitle": "Actualizaciones de producto, mercado y pagos de Spliton.",
  "news.error.live": "No se pudieron cargar las noticias. El servicio no está disponible temporalmente.",
  "news.error.demo": "No se pudieron cargar las noticias. Intente actualizar la página.",
  "news.retry": "Reintentar",
  "news.detail.error.load": "No se pudo cargar el artículo. El servicio no está disponible temporalmente.",
  "news.detail.error.backToList": "Volver a noticias",
  "news.empty.title": "Nada encontrado",
  "news.empty.searchHint": "Pruebe otra búsqueda o restablezca el filtro de categoría.",
  "news.empty.categoryHint": "Aún no hay artículos publicados en esta categoría.",
  "news.empty.resetFilters": "Restablecer filtros",
  "news.list.aria": "Publicaciones",

  "news.category.all": "Todos",
  "news.category.product": "Producto",
  "news.category.market": "Mercado",
  "news.category.payouts": "Pagos",
  "news.category.legal": "Documentos",

  "news.pagination.prev": "Página anterior",
  "news.pagination.next": "Página siguiente",
  "news.pagination.page": "Página {page} de {total}",
};

const PT: Record<string, string> = {
  "meta.news.title": "Notícias",
  "meta.news.description":
    "Notícias e atualizações Spliton: produto, pagamentos USDT (TRC20) e mercado secundário.",

  "news.hero.title": "Notícias",
  "news.hero.subtitle": "Atualizações da plataforma — produto, mercado, pagamentos e documentos.",
  "news.breadcrumb": "Saber mais",
  "news.breadcrumbBlog": "Blog",
  "news.searchPlaceholder": "Pesquisar artigos",
  "news.blogTitle": "Blog",
  "news.blogSubtitle": "Atualizações de produto, mercado e pagamentos Spliton.",
  "news.error.live": "Não foi possível carregar as notícias. Serviço temporariamente indisponível.",
  "news.error.demo": "Não foi possível carregar as notícias. Tente atualizar a página.",
  "news.retry": "Tentar novamente",
  "news.detail.error.load": "Não foi possível carregar o artigo. Serviço temporariamente indisponível.",
  "news.detail.error.backToList": "Voltar às notícias",
  "news.empty.title": "Nada encontrado",
  "news.empty.searchHint": "Tente outra pesquisa ou reponha o filtro de categoria.",
  "news.empty.categoryHint": "Ainda não há artigos publicados nesta categoria.",
  "news.empty.resetFilters": "Repor filtros",
  "news.list.aria": "Publicações",

  "news.category.all": "Todos",
  "news.category.product": "Produto",
  "news.category.market": "Mercado",
  "news.category.payouts": "Pagamentos",
  "news.category.legal": "Documentos",

  "news.pagination.prev": "Página anterior",
  "news.pagination.next": "Página seguinte",
  "news.pagination.page": "Página {page} de {total}",
};

export const NEWS_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
