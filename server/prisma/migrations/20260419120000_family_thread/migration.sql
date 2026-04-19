-- Drop old messages and recreate with new schema
DELETE FROM "Message";

-- SQLite requires recreating the table to change columns
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personSlug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parsedType" TEXT,
    "parsedDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
