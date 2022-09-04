CREATE TABLE "user" (
	i									INT PRIMARY KEY NOT NULL,
	email							CHAR(320)       NOT NULL,
	email_token				INT							NOT NULL,
	password					CHAR(8192)			NOT NULL,
	created_at				TIMESTAMP				NOT NULL,
	instance_limit		INT 						NOT NULL,

	UNIQUE(email),
	UNIQUE(i)
);


CREATE TABLE "instance" (
	i									INT PRIMARY KEY NOT NULL,
	i_user						INT 						NOT NULL,
	name							CHAR(24)				NOT NULL,
	alias							CHAR(24)				NOT NULL,
	query_limit				INT							NOT NULL,

	UNIQUE(i),
	UNIQUE(name),

	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i)
);

CREATE TABLE "blocklist" (
	i									INT PRIMARY KEY NOT NULL,
	i_user						INT							NOT NULL,
	i_instance				INT							NOT NULL,
	address						CHAR(2048)			NOT NULL,
	entry_limit				INT							NOT NULL,

	UNIQUE(i),

	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i),
	CONSTRAINT for_instance FOREIGN KEY(i_instance) REFERENCES "instance"(i)
);

CREATE TABLE "blockfile" (
	i									INT PRIMARY KEY NOT NULL,
	i_user						INT							NOT NULL,
	i_instance				INT							NOT NULL,
	content						TEXT						NOT NULL,
	entry_limit				INT							NOT NULL,

	UNIQUE(i),

	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i),
	CONSTRAINT for_instance FOREIGN KEY(i_instance) REFERENCES "instance"(i)
);
