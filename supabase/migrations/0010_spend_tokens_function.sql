-- Atomic token spending: decrements balance only if sufficient, inserts transaction, returns remaining balance.
create or replace function public.spend_tokens(
  p_user_id uuid,
  p_cost int,
  p_action text
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_remaining int;
begin
  -- Atomically decrement, only if balance is sufficient
  update public.token_balances
  set balance = balance - p_cost,
      updated_at = now()
  where user_id = p_user_id
    and balance >= p_cost
  returning balance into v_remaining;

  if not found then
    raise exception 'INSUFFICIENT_TOKENS';
  end if;

  -- Record usage transaction
  insert into public.token_transactions (user_id, type, amount, action)
  values (p_user_id, 'usage', -p_cost, p_action);

  return v_remaining;
end;
$$;
