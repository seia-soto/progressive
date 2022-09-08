CREATE TABLE "user" (
	i										SERIAL 	PRIMARY KEY NOT NULL,
	email								CHAR(320)       		NOT NULL,
	email_token					INT									NOT NULL,
	password						CHAR(8192)					NOT NULL,
	created_at					TIMESTAMP						NOT NULL,
	instance_limit			INT 								NOT NULL,

	UNIQUE(email),
	UNIQUE(i)
);

CREATE TABLE "instance" (
	i										SERIAL 	PRIMARY KEY NOT NULL,
	i_user							SERIAL 							NOT NULL,
	alias								CHAR(24)						NOT NULL,
	upstream						CHAR(1024)					NOT NULL,
	query_limit					INT									NOT NULL,
	manual_limit				INT									NOT NULL,

	UNIQUE(i),

	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i)
);

CREATE TABLE "blocklist" (
	i										SERIAL 	PRIMARY KEY NOT NULL,
	i_user							SERIAL							NOT NULL,
	i_instance					SERIAL							NOT NULL,
	address							CHAR(2048)					NOT NULL,
	entry_limit					INT									NOT NULL,

	UNIQUE(i),

	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i),
	CONSTRAINT for_instance FOREIGN KEY(i_instance) REFERENCES "instance"(i)
);
