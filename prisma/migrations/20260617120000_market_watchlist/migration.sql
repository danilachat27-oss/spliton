-- CreateTable
CREATE TABLE "market_watchlist_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_watchlist_user_id_idx" ON "market_watchlist_items"("user_id");

-- CreateIndex
CREATE INDEX "market_watchlist_release_id_idx" ON "market_watchlist_items"("release_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_watchlist_user_release_key" ON "market_watchlist_items"("user_id", "release_id");

-- AddForeignKey
ALTER TABLE "market_watchlist_items" ADD CONSTRAINT "market_watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_watchlist_items" ADD CONSTRAINT "market_watchlist_items_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
