begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public', 'enquiries', 'enquiries table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.enquiries'::regclass), 'enquiry RLS is enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.enquiries'::regclass), 'enquiry RLS is forced');
select has_table_privilege('service_role', 'public.enquiries', 'INSERT'), 'service role may create public enquiries');
select has_table_privilege('authenticated', 'public.enquiries', 'SELECT'), 'authenticated role receives select grant');
select hasnt_table_privilege('anon', 'public.enquiries', 'SELECT'), 'anonymous visitors cannot read enquiries');
select hasnt_table_privilege('anon', 'public.enquiries', 'INSERT'), 'anonymous visitors cannot bypass the server endpoint');
select policies_are('public', 'enquiries', array['enquiries_agent_select', 'enquiries_agent_update'], 'enquiry policies are complete');
select has_trigger('public', 'enquiries', 'enquiries_audit', 'enquiry changes are audited');

select * from finish();
rollback;
