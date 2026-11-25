create table public.users (
  id uuid not null,
  name character varying(100) not null,
  email character varying(150) not null,
  username character varying null,
  role text null default 'usuario',
  status boolean default TRUE,
  created_at timestamp with time zone null default now(),
  constraint user_pkey primary key (id),
  constraint user_email_key unique (email),
  constraint user_id_fkey foreign key (id) references auth.users (id) on update cascade on delete cascade
) tablespace pg_default;

create table public.category (
  id uuid not null default extensions.uuid_generate_v4 (),
  name character varying(100) not null,
  description text null,
  active boolean null default true,
  constraint category_pkey primary key (id),
  constraint category_name_key unique (name)
) tablespace pg_default;

create table public.ticket (
  id uuid not null default extensions.uuid_generate_v4 (),
  title character varying(150) not null,
  description text not null,
  type character varying(50) not null,
  modality text null,
  subcategory character varying(100) null,
  impact character varying(20) not null default 'LOW'::character varying,
  urgency character varying(20) not null default 'LOW'::character varying,
  priority character varying(20) not null default 'LOW'::character varying,
  status character varying(20) not null default 'OPEN'::character varying,
  diagnosis text null,
  resolution text null,
  draft boolean null,
  category_id uuid not null,
  created_by uuid not null,
  assigned_to uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ticket_pkey primary key (id),
  constraint ticket_assigned_to_fkey foreign key (assigned_to) references public.users (id) on delete set null,
  constraint ticket_category_id_fkey foreign key (category_id) references public.category (id) on delete restrict,
  constraint ticket_created_by_fkey foreign key (created_by) references public.users (id) on delete restrict
) tablespace pg_default;

create table public.comment (
  id uuid not null default extensions.uuid_generate_v4 (),
  ticket_id uuid not null,
  user_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint comment_pkey primary key (id),
  constraint comment_ticket_id_fkey foreign key (ticket_id) references public.ticket (id) on delete cascade,
  constraint comment_user_id_fkey foreign key (user_id) references public.users (id) on delete restrict
) tablespace pg_default;

create table public.attachment (
  id uuid not null default extensions.uuid_generate_v4 (),
  ticket_id uuid not null,
  file_name character varying(255) not null,
  file_type character varying(50) not null,
  file_size integer not null,
  file_path character varying(500) not null,
  uploaded_at timestamp with time zone null default now(),
  constraint attachment_pkey primary key (id),
  constraint attachment_ticket_id_fkey foreign key (ticket_id) references public.ticket (id) on delete cascade
) tablespace pg_default;

create table public.status_history (
  id uuid not null default extensions.uuid_generate_v4 (),
  ticket_id uuid not null,
  old_status character varying(30) null,
  new_status character varying(30) not null,
  changed_by uuid not null,
  changed_at timestamp with time zone null default now(),
  constraint status_history_pkey primary key (id),
  constraint status_history_changed_by_fkey foreign key (changed_by) references public.users (id) on delete restrict,
  constraint status_history_ticket_id_fkey foreign key (ticket_id) references public.ticket (id) on delete cascade
) tablespace pg_default;

create table public.priority_history (
  id uuid not null default extensions.uuid_generate_v4 (),
  ticket_id uuid not null,
  old_priority character varying(20) not null,
  new_priority character varying(20) not null,
  changed_by uuid not null,
  reason text null,
  changed_at timestamp with time zone null default now(),
  constraint priority_history_pkey primary key (id),
  constraint priority_history_changed_by_fkey foreign key (changed_by) references public.users (id) on delete restrict,
  constraint priority_history_ticket_id_fkey foreign key (ticket_id) references public.ticket (id) on delete cascade
) tablespace pg_default;

create table public.assignment_history (
  id uuid not null default extensions.uuid_generate_v4 (),
  ticket_id uuid not null,
  assigned_to uuid not null,
  assigned_by uuid not null,
  assigned_at timestamp with time zone null default now(),
  constraint assignment_history_pkey primary key (id),
  constraint assignment_history_assigned_by_fkey foreign key (assigned_by) references public.users (id) on delete restrict,
  constraint assignment_history_assigned_to_fkey foreign key (assigned_to) references public.users (id) on delete restrict,
  constraint assignment_history_ticket_id_fkey foreign key (ticket_id) references public.ticket (id) on delete cascade
) tablespace pg_default;

create table public.ticket_reopen_log (
  id uuid not null default extensions.uuid_generate_v4 (),
  ticket_id uuid not null,
  reopened_by uuid not null,
  reason text not null,
  reopened_at timestamp with time zone null default now(),
  constraint ticket_reopen_log_pkey primary key (id),
  constraint ticket_reopen_log_reopened_by_fkey foreign key (reopened_by) references public.users (id) on delete restrict,
  constraint ticket_reopen_log_ticket_id_fkey foreign key (ticket_id) references public.ticket (id) on delete cascade
) tablespace pg_default;

-- Triggers
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, username, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'role', 'usuario')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- username unico
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
ON public.users (LOWER(username));

-- comments files
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', true)
on conflict (id) do nothing;

create policy "Permitir subida autenticada de adjuntos"
on storage.objects for insert to authenticated
with check (bucket_id = 'ticket-attachments');

create policy "Lectura publica de adjuntos"
on storage.objects for select to public
using (bucket_id = 'ticket-attachments');

-- 
create or replace function public.get_users_with_auth()
returns table (
  id uuid,
  name character varying(100),
  email character varying(150),
  username character varying,
  role text,
  status boolean,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.name,
    u.email,
    u.username,
    u.role,
    u.status,
    u.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  from public.users u
  left join auth.users au on au.id = u.id
  order by u.created_at desc;
$$;

revoke all on function public.get_users_with_auth() from public;
grant execute on function public.get_users_with_auth() to authenticated;