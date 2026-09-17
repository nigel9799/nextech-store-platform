begin;

-- No grants are revoked here: migrations 0005 and 0008 establish the same
-- required permissions, so revoking them would not restore the preceding
-- schema state and would break the server-side storefront repository.

commit;
