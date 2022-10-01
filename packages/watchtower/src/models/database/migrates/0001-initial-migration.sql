CREATE TABLE "user" (
	i SERIAL PRIMARY KEY NOT NULL,
	email TEXT NOT NULL,
	email_token INT NOT NULL,
	password TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL,
	UNIQUE(email),
	UNIQUE(i)
);

CREATE TABLE "instance" (
	i SERIAL PRIMARY KEY NOT NULL,
	i_user SERIAL NOT NULL,
	status INT NOT NULL,
	alias TEXT NOT NULL,
	upstream TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	UNIQUE(i),
	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i)
);

CREATE TABLE "blocklist" (
	i SERIAL PRIMARY KEY NOT NULL,
	i_user SERIAL NOT NULL,
	i_instance SERIAL NOT NULL,
	name TEXT NOT NULL,
	address TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	UNIQUE(i),
	CONSTRAINT for_user FOREIGN KEY(i_user) REFERENCES "user"(i),
	CONSTRAINT for_instance FOREIGN KEY(i_instance) REFERENCES "instance"(i)
);
