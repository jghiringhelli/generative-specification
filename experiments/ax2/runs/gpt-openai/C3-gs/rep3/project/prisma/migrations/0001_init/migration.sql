CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "ArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("articleId", "tagName")
);

CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "articleId")
);

CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followedId" TEXT NOT NULL,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId", "followedId")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_authorId_createdAt_idx" ON "Article"("authorId", "createdAt");
CREATE INDEX "Comment_articleId_createdAt_idx" ON "Comment"("articleId", "createdAt");

ALTER TABLE "Article"
ADD CONSTRAINT "Article_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleTag"
ADD CONSTRAINT "ArticleTag_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleTag"
ADD CONSTRAINT "ArticleTag_tagName_fkey"
FOREIGN KEY ("tagName") REFERENCES "Tag"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow"
ADD CONSTRAINT "Follow_followerId_fkey"
FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow"
ADD CONSTRAINT "Follow_followedId_fkey"
FOREIGN KEY ("followedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
