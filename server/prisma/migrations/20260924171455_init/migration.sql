-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "state" TEXT,
    "district" TEXT,
    "occupation" TEXT,
    "annualIncome" DOUBLE PRECISION,
    "category" TEXT,
    "education" TEXT,
    "employmentStatus" TEXT,
    "landOwnership" BOOLEAN,
    "disability" BOOLEAN,
    "maritalStatus" TEXT,
    "otherInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ministry" TEXT,
    "category" TEXT NOT NULL,
    "state" TEXT,
    "level" TEXT NOT NULL DEFAULT 'Central',
    "applicationProcess" TEXT,
    "officialUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_eligibility" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "criteriaType" TEXT NOT NULL,
    "operator" TEXT,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scheme_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_benefits" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" TEXT,

    CONSTRAINT "scheme_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_documents" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scheme_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_sources" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "scheme_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_schemes" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchedCriteria" JSONB NOT NULL,
    "missingCriteria" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "recommendation_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "schemeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_slug_key" ON "schemes"("slug");

-- CreateIndex
CREATE INDEX "schemes_category_idx" ON "schemes"("category");

-- CreateIndex
CREATE INDEX "schemes_state_idx" ON "schemes"("state");

-- CreateIndex
CREATE INDEX "schemes_level_idx" ON "schemes"("level");

-- CreateIndex
CREATE INDEX "schemes_status_idx" ON "schemes"("status");

-- CreateIndex
CREATE INDEX "scheme_eligibility_schemeId_idx" ON "scheme_eligibility"("schemeId");

-- CreateIndex
CREATE INDEX "scheme_eligibility_criteriaType_idx" ON "scheme_eligibility"("criteriaType");

-- CreateIndex
CREATE INDEX "scheme_benefits_schemeId_idx" ON "scheme_benefits"("schemeId");

-- CreateIndex
CREATE INDEX "scheme_documents_schemeId_idx" ON "scheme_documents"("schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "scheme_sources_schemeId_key" ON "scheme_sources"("schemeId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_schemeId_key" ON "bookmarks"("userId", "schemeId");

-- CreateIndex
CREATE INDEX "recommendations_userId_idx" ON "recommendations"("userId");

-- CreateIndex
CREATE INDEX "recommendations_createdAt_idx" ON "recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "recommendation_schemes_recommendationId_idx" ON "recommendation_schemes"("recommendationId");

-- CreateIndex
CREATE INDEX "recommendation_schemes_status_idx" ON "recommendation_schemes"("status");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_updatedAt_idx" ON "chat_sessions"("updatedAt");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_eligibility" ADD CONSTRAINT "scheme_eligibility_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_benefits" ADD CONSTRAINT "scheme_benefits_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_documents" ADD CONSTRAINT "scheme_documents_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_sources" ADD CONSTRAINT "scheme_sources_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_schemes" ADD CONSTRAINT "recommendation_schemes_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_schemes" ADD CONSTRAINT "recommendation_schemes_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
