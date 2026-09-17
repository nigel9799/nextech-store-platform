import { createCategoryAction } from "@/app/admin/catalogue/actions";
import {
  CategoryForm,
  errorMessages,
} from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminContext("manage_catalogue");
  const query = await searchParams;
  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Catalogue</p>
        <h1>ADD CATEGORY</h1>
        <p>The slug and display order can be generated automatically.</p>
      </div>
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          {errorMessages[query.error] ?? errorMessages.invalid}
        </p>
      ) : null}
      <section className="admin-panel">
        <CategoryForm action={createCategoryAction} />
      </section>
    </>
  );
}
