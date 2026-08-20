grant update (theme, sentiment)
  on table public.reviews
  to anon, authenticated;

create policy "VoiceLoop analysis can fill empty review results"
  on public.reviews
  for update
  to anon, authenticated
  using (
    theme is null
    and sentiment is null
  )
  with check (
    theme in (
      'Food Quality',
      'Service Speed',
      'Staff Friendliness',
      'Wait Time',
      'Atmosphere',
      'Cleanliness',
      'Value',
      'Parking',
      'Ordering / Delivery',
      'Other'
    )
    and sentiment in ('positive', 'neutral', 'negative')
  );
