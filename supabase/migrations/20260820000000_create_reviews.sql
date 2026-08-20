create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  review_text text not null,
  rating integer,
  review_date date,
  source text,
  reviewer_name text,
  sentiment text,
  theme text,
  created_at timestamp with time zone not null default now(),

  constraint reviews_review_text_not_blank
    check (char_length(btrim(review_text)) > 0),
  constraint reviews_rating_range
    check (rating is null or rating between 1 and 5),
  constraint reviews_sentiment_values
    check (
      sentiment is null
      or sentiment in ('positive', 'neutral', 'negative')
    )
);

create index reviews_created_at_idx
  on public.reviews (created_at desc);

create index reviews_review_date_idx
  on public.reviews (review_date desc);

create index reviews_source_idx
  on public.reviews (source);

alter table public.reviews enable row level security;

revoke all on table public.reviews from anon, authenticated;
grant select, insert on table public.reviews to anon, authenticated;

create policy "VoiceLoop reviews are readable"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

create policy "VoiceLoop reviews can be inserted"
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(review_text)) > 0
    and (rating is null or rating between 1 and 5)
    and (
      sentiment is null
      or sentiment in ('positive', 'neutral', 'negative')
    )
  );
