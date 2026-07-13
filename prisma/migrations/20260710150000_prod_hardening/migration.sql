-- CreateTable
CREATE TABLE "whatsapp_processed_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_processed_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_archived_idx" ON "user"("archived");

-- CreateIndex
CREATE INDEX "demandes_user_id_idx" ON "demandes"("user_id");

-- CreateIndex
CREATE INDEX "demandes_status_idx" ON "demandes"("status");

-- CreateIndex
CREATE INDEX "demandes_assigned_to_idx" ON "demandes"("assigned_to");

-- CreateIndex
CREATE INDEX "demandes_created_at_idx" ON "demandes"("created_at");

-- CreateIndex
CREATE INDEX "demandes_last_activity_at_idx" ON "demandes"("last_activity_at");

-- CreateIndex
CREATE INDEX "messages_demande_id_idx" ON "messages"("demande_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");
