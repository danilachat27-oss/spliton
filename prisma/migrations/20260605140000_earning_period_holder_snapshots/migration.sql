-- CreateTable
CREATE TABLE "earning_period_holder_snapshots" (
    "id" UUID NOT NULL,
    "earning_period_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "eligible_units" DECIMAL(20,8) NOT NULL,
    "cutoff_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OWNERSHIP_LEDGER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earning_period_holder_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "earning_period_holder_snapshots_period_user_release_key" ON "earning_period_holder_snapshots"("earning_period_id", "user_id", "release_id");

-- CreateIndex
CREATE INDEX "earning_period_holder_snapshots_earning_period_id_idx" ON "earning_period_holder_snapshots"("earning_period_id");

-- CreateIndex
CREATE INDEX "earning_period_holder_snapshots_release_id_cutoff_at_idx" ON "earning_period_holder_snapshots"("release_id", "cutoff_at");

-- AddForeignKey
ALTER TABLE "earning_period_holder_snapshots" ADD CONSTRAINT "earning_period_holder_snapshots_earning_period_id_fkey" FOREIGN KEY ("earning_period_id") REFERENCES "earning_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning_period_holder_snapshots" ADD CONSTRAINT "earning_period_holder_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning_period_holder_snapshots" ADD CONSTRAINT "earning_period_holder_snapshots_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
