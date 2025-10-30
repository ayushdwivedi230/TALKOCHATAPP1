-- SQL to create users and messages tables (from shared/schema.ts)
CREATE TABLE IF NOT EXISTS public.users (
  id serial PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
  id serial PRIMARY KEY,
  sender_id integer NOT NULL REFERENCES public.users(id),
  recipient_id integer REFERENCES public.users(id),
  text text NOT NULL,
  timestamp timestamp without time zone DEFAULT now() NOT NULL
);

-- Indexes (optional)
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
