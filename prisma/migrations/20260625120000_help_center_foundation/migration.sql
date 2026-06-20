-- Help Center foundation: categories and articles (additive, no destructive changes).

-- CreateEnum
CREATE TYPE "help_article_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "help_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "description_translations" JSONB NOT NULL DEFAULT '{}',
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" UUID,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "excerpt_translations" JSONB NOT NULL DEFAULT '{}',
    "content_translations" JSONB NOT NULL DEFAULT '{}',
    "status" "help_article_status" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_getting_started" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "author_user_id" UUID NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "help_categories_slug_key" ON "help_categories"("slug");

-- CreateIndex
CREATE INDEX "help_categories_parent_id_sort_order_idx" ON "help_categories"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "help_categories_is_published_sort_order_idx" ON "help_categories"("is_published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");

-- CreateIndex
CREATE INDEX "help_articles_category_id_idx" ON "help_articles"("category_id");

-- CreateIndex
CREATE INDEX "help_articles_status_idx" ON "help_articles"("status");

-- CreateIndex
CREATE INDEX "help_articles_sort_order_idx" ON "help_articles"("sort_order");

-- CreateIndex
CREATE INDEX "help_articles_is_featured_idx" ON "help_articles"("is_featured");

-- CreateIndex
CREATE INDEX "help_articles_is_popular_idx" ON "help_articles"("is_popular");

-- CreateIndex
CREATE INDEX "help_articles_is_getting_started_idx" ON "help_articles"("is_getting_started");

-- CreateIndex
CREATE INDEX "help_articles_status_published_at_idx" ON "help_articles"("status", "published_at");

-- AddForeignKey
ALTER TABLE "help_categories" ADD CONSTRAINT "help_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "help_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "help_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
