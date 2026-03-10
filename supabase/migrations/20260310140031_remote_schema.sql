drop extension if exists "pg_net";

drop policy "Group members can view balances" on "public"."balances";

drop policy "Group members can manage expense participants" on "public"."expense_participants";

drop policy "Group members can manage expenses" on "public"."expenses";

drop policy "Admins can update group members" on "public"."group_members";

drop policy "Members can view group_members" on "public"."group_members";

drop policy "Users can join groups" on "public"."group_members";

drop policy "Users can leave group or admins can remove" on "public"."group_members";

drop policy "Admins can delete group" on "public"."groups";

drop policy "Admins can update group" on "public"."groups";

drop policy "Members can view group" on "public"."groups";

drop policy "Users can view own and group members profiles" on "public"."profiles";

drop policy "Group members can create settlement payments" on "public"."settlement_payments";

drop policy "Group members can view settlement payments" on "public"."settlement_payments";

drop policy "Group members can create tabs" on "public"."tabs";

drop policy "Group members can view tabs" on "public"."tabs";

drop policy "Tab creator or admin can delete tabs" on "public"."tabs";

drop policy "Tab creator or admin can update tabs" on "public"."tabs";

alter table "public"."balances" drop constraint "balances_from_user_fkey";

alter table "public"."balances" drop constraint "balances_group_id_fkey";

alter table "public"."balances" drop constraint "balances_tab_id_fkey";

alter table "public"."balances" drop constraint "balances_to_user_fkey";

alter table "public"."expense_participants" drop constraint "expense_participants_expense_id_fkey";

alter table "public"."expense_participants" drop constraint "expense_participants_user_id_fkey";

alter table "public"."expenses" drop constraint "expenses_created_by_fkey";

alter table "public"."expenses" drop constraint "expenses_group_id_fkey";

alter table "public"."expenses" drop constraint "expenses_paid_by_fkey";

alter table "public"."expenses" drop constraint "expenses_tab_id_fkey";

alter table "public"."group_members" drop constraint "group_members_group_id_fkey";

alter table "public"."group_members" drop constraint "group_members_user_id_fkey";

alter table "public"."groups" drop constraint "groups_created_by_fkey";

alter table "public"."settlement_payments" drop constraint "settlement_payments_created_by_fkey";

alter table "public"."settlement_payments" drop constraint "settlement_payments_from_user_fkey";

alter table "public"."settlement_payments" drop constraint "settlement_payments_group_id_fkey";

alter table "public"."settlement_payments" drop constraint "settlement_payments_tab_id_fkey";

alter table "public"."settlement_payments" drop constraint "settlement_payments_to_user_fkey";

alter table "public"."tabs" drop constraint "tabs_created_by_fkey";

alter table "public"."tabs" drop constraint "tabs_group_id_fkey";


  create table "public"."plans" (
    "id" text not null,
    "name" text not null,
    "monthly_price_cents" integer not null,
    "annual_price_cents" integer not null,
    "max_groups" integer,
    "max_members_per_group" integer not null,
    "expense_history_months" integer,
    "tokens_monthly_grant" integer not null
      );



  create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan_id" text not null default 'free'::text,
    "billing_cycle" text,
    "status" text not null default 'active'::text,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "stripe_subscription_id" text,
    "stripe_customer_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."subscriptions" enable row level security;


  create table "public"."token_balances" (
    "user_id" uuid not null,
    "balance" integer not null default 0,
    "reset_at" timestamp with time zone not null default (date_trunc('month'::text, now()) + '1 mon'::interval),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."token_balances" enable row level security;


  create table "public"."token_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "amount" integer not null,
    "action" text,
    "stripe_payment_intent_id" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."token_transactions" enable row level security;

alter table "public"."expenses" alter column "category" set default 'other'::public.expense_category;

alter table "public"."expenses" alter column "category" set data type public.expense_category using "category"::text::public.expense_category;

alter table "public"."expenses" alter column "split_type" set default 'equal'::public.split_type;

alter table "public"."expenses" alter column "split_type" set data type public.split_type using "split_type"::text::public.split_type;

alter table "public"."tabs" alter column "status" set default 'open'::public.tab_status;

alter table "public"."tabs" alter column "status" set data type public.tab_status using "status"::text::public.tab_status;

CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX subscriptions_user_id_key ON public.subscriptions USING btree (user_id);

CREATE UNIQUE INDEX token_balances_pkey ON public.token_balances USING btree (user_id);

CREATE UNIQUE INDEX token_transactions_pkey ON public.token_transactions USING btree (id);

alter table "public"."plans" add constraint "plans_pkey" PRIMARY KEY using index "plans_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."token_balances" add constraint "token_balances_pkey" PRIMARY KEY using index "token_balances_pkey";

alter table "public"."token_transactions" add constraint "token_transactions_pkey" PRIMARY KEY using index "token_transactions_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_billing_cycle_check" CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'annual'::text]))) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_billing_cycle_check";

alter table "public"."subscriptions" add constraint "subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.plans(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_plan_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_key" UNIQUE using index "subscriptions_user_id_key";

alter table "public"."token_balances" add constraint "token_balances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."token_balances" validate constraint "token_balances_user_id_fkey";

alter table "public"."token_transactions" add constraint "token_transactions_type_check" CHECK ((type = ANY (ARRAY['purchase'::text, 'monthly_grant'::text, 'usage'::text]))) not valid;

alter table "public"."token_transactions" validate constraint "token_transactions_type_check";

alter table "public"."token_transactions" add constraint "token_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."token_transactions" validate constraint "token_transactions_user_id_fkey";

alter table "public"."balances" add constraint "balances_from_user_fkey" FOREIGN KEY (from_user) REFERENCES public.profiles(id) not valid;

alter table "public"."balances" validate constraint "balances_from_user_fkey";

alter table "public"."balances" add constraint "balances_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."balances" validate constraint "balances_group_id_fkey";

alter table "public"."balances" add constraint "balances_tab_id_fkey" FOREIGN KEY (tab_id) REFERENCES public.tabs(id) ON DELETE CASCADE not valid;

alter table "public"."balances" validate constraint "balances_tab_id_fkey";

alter table "public"."balances" add constraint "balances_to_user_fkey" FOREIGN KEY (to_user) REFERENCES public.profiles(id) not valid;

alter table "public"."balances" validate constraint "balances_to_user_fkey";

alter table "public"."expense_participants" add constraint "expense_participants_expense_id_fkey" FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE not valid;

alter table "public"."expense_participants" validate constraint "expense_participants_expense_id_fkey";

alter table "public"."expense_participants" add constraint "expense_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."expense_participants" validate constraint "expense_participants_user_id_fkey";

alter table "public"."expenses" add constraint "expenses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."expenses" validate constraint "expenses_created_by_fkey";

alter table "public"."expenses" add constraint "expenses_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_group_id_fkey";

alter table "public"."expenses" add constraint "expenses_paid_by_fkey" FOREIGN KEY (paid_by) REFERENCES public.profiles(id) not valid;

alter table "public"."expenses" validate constraint "expenses_paid_by_fkey";

alter table "public"."expenses" add constraint "expenses_tab_id_fkey" FOREIGN KEY (tab_id) REFERENCES public.tabs(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_tab_id_fkey";

alter table "public"."group_members" add constraint "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."group_members" validate constraint "group_members_group_id_fkey";

alter table "public"."group_members" add constraint "group_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."group_members" validate constraint "group_members_user_id_fkey";

alter table "public"."groups" add constraint "groups_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."groups" validate constraint "groups_created_by_fkey";

alter table "public"."settlement_payments" add constraint "settlement_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."settlement_payments" validate constraint "settlement_payments_created_by_fkey";

alter table "public"."settlement_payments" add constraint "settlement_payments_from_user_fkey" FOREIGN KEY (from_user) REFERENCES public.profiles(id) not valid;

alter table "public"."settlement_payments" validate constraint "settlement_payments_from_user_fkey";

alter table "public"."settlement_payments" add constraint "settlement_payments_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."settlement_payments" validate constraint "settlement_payments_group_id_fkey";

alter table "public"."settlement_payments" add constraint "settlement_payments_tab_id_fkey" FOREIGN KEY (tab_id) REFERENCES public.tabs(id) ON DELETE CASCADE not valid;

alter table "public"."settlement_payments" validate constraint "settlement_payments_tab_id_fkey";

alter table "public"."settlement_payments" add constraint "settlement_payments_to_user_fkey" FOREIGN KEY (to_user) REFERENCES public.profiles(id) not valid;

alter table "public"."settlement_payments" validate constraint "settlement_payments_to_user_fkey";

alter table "public"."tabs" add constraint "tabs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."tabs" validate constraint "tabs_created_by_fkey";

alter table "public"."tabs" add constraint "tabs_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."tabs" validate constraint "tabs_group_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user_monetization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'active');

  insert into public.token_balances (user_id, balance)
  values (new.id, 2);

  insert into public.token_transactions (user_id, type, amount)
  values (new.id, 'monthly_grant', 2);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spend_tokens(p_user_id uuid, p_cost integer, p_action text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

grant delete on table "public"."plans" to "anon";

grant insert on table "public"."plans" to "anon";

grant references on table "public"."plans" to "anon";

grant select on table "public"."plans" to "anon";

grant trigger on table "public"."plans" to "anon";

grant truncate on table "public"."plans" to "anon";

grant update on table "public"."plans" to "anon";

grant delete on table "public"."plans" to "authenticated";

grant insert on table "public"."plans" to "authenticated";

grant references on table "public"."plans" to "authenticated";

grant select on table "public"."plans" to "authenticated";

grant trigger on table "public"."plans" to "authenticated";

grant truncate on table "public"."plans" to "authenticated";

grant update on table "public"."plans" to "authenticated";

grant delete on table "public"."plans" to "service_role";

grant insert on table "public"."plans" to "service_role";

grant references on table "public"."plans" to "service_role";

grant select on table "public"."plans" to "service_role";

grant trigger on table "public"."plans" to "service_role";

grant truncate on table "public"."plans" to "service_role";

grant update on table "public"."plans" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."token_balances" to "anon";

grant insert on table "public"."token_balances" to "anon";

grant references on table "public"."token_balances" to "anon";

grant select on table "public"."token_balances" to "anon";

grant trigger on table "public"."token_balances" to "anon";

grant truncate on table "public"."token_balances" to "anon";

grant update on table "public"."token_balances" to "anon";

grant delete on table "public"."token_balances" to "authenticated";

grant insert on table "public"."token_balances" to "authenticated";

grant references on table "public"."token_balances" to "authenticated";

grant select on table "public"."token_balances" to "authenticated";

grant trigger on table "public"."token_balances" to "authenticated";

grant truncate on table "public"."token_balances" to "authenticated";

grant update on table "public"."token_balances" to "authenticated";

grant delete on table "public"."token_balances" to "service_role";

grant insert on table "public"."token_balances" to "service_role";

grant references on table "public"."token_balances" to "service_role";

grant select on table "public"."token_balances" to "service_role";

grant trigger on table "public"."token_balances" to "service_role";

grant truncate on table "public"."token_balances" to "service_role";

grant update on table "public"."token_balances" to "service_role";

grant delete on table "public"."token_transactions" to "anon";

grant insert on table "public"."token_transactions" to "anon";

grant references on table "public"."token_transactions" to "anon";

grant select on table "public"."token_transactions" to "anon";

grant trigger on table "public"."token_transactions" to "anon";

grant truncate on table "public"."token_transactions" to "anon";

grant update on table "public"."token_transactions" to "anon";

grant delete on table "public"."token_transactions" to "authenticated";

grant insert on table "public"."token_transactions" to "authenticated";

grant references on table "public"."token_transactions" to "authenticated";

grant select on table "public"."token_transactions" to "authenticated";

grant trigger on table "public"."token_transactions" to "authenticated";

grant truncate on table "public"."token_transactions" to "authenticated";

grant update on table "public"."token_transactions" to "authenticated";

grant delete on table "public"."token_transactions" to "service_role";

grant insert on table "public"."token_transactions" to "service_role";

grant references on table "public"."token_transactions" to "service_role";

grant select on table "public"."token_transactions" to "service_role";

grant trigger on table "public"."token_transactions" to "service_role";

grant truncate on table "public"."token_transactions" to "service_role";

grant update on table "public"."token_transactions" to "service_role";


  create policy "Users manage their own subscription"
  on "public"."subscriptions"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users view their own token balance"
  on "public"."token_balances"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users view their own token transactions"
  on "public"."token_transactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Group members can view balances"
  on "public"."balances"
  as permissive
  for select
  to public
using (public.is_group_member(group_id));



  create policy "Group members can manage expense participants"
  on "public"."expense_participants"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.expenses e
  WHERE ((e.id = expense_participants.expense_id) AND public.is_group_member(e.group_id)))));



  create policy "Group members can manage expenses"
  on "public"."expenses"
  as permissive
  for all
  to public
using (public.is_group_member(group_id));



  create policy "Admins can update group members"
  on "public"."group_members"
  as permissive
  for update
  to public
using (public.is_group_admin(group_id))
with check (public.is_group_admin(group_id));



  create policy "Members can view group_members"
  on "public"."group_members"
  as permissive
  for select
  to public
using (public.is_group_member(group_id));



  create policy "Users can join groups"
  on "public"."group_members"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (public.is_group_member(group_id) OR public.is_group_creator(group_id))));



  create policy "Users can leave group or admins can remove"
  on "public"."group_members"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) OR public.is_group_admin(group_id)));



  create policy "Admins can delete group"
  on "public"."groups"
  as permissive
  for delete
  to public
using (public.is_group_admin(id));



  create policy "Admins can update group"
  on "public"."groups"
  as permissive
  for update
  to public
using (public.is_group_admin(id))
with check (public.is_group_admin(id));



  create policy "Members can view group"
  on "public"."groups"
  as permissive
  for select
  to public
using (public.is_group_member(id));



  create policy "Users can view own and group members profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((auth.uid() = id) OR public.shares_group_with(id)));



  create policy "Group members can create settlement payments"
  on "public"."settlement_payments"
  as permissive
  for insert
  to public
with check ((public.is_group_member(group_id) AND (auth.uid() = created_by)));



  create policy "Group members can view settlement payments"
  on "public"."settlement_payments"
  as permissive
  for select
  to public
using (public.is_group_member(group_id));



  create policy "Group members can create tabs"
  on "public"."tabs"
  as permissive
  for insert
  to public
with check ((public.is_group_member(group_id) AND (auth.uid() = created_by)));



  create policy "Group members can view tabs"
  on "public"."tabs"
  as permissive
  for select
  to public
using (public.is_group_member(group_id));



  create policy "Tab creator or admin can delete tabs"
  on "public"."tabs"
  as permissive
  for delete
  to public
using (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM public.group_members gm
  WHERE ((gm.group_id = tabs.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = 'admin'::text))))));



  create policy "Tab creator or admin can update tabs"
  on "public"."tabs"
  as permissive
  for update
  to public
using (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM public.group_members gm
  WHERE ((gm.group_id = tabs.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = 'admin'::text))))));


drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created_monetization AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_monetization();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


