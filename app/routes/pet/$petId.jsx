import { useLoaderData, useActionData } from '@remix-run/react';
import { useState } from 'react';
import db from '../../db/index.js';
import { petTypes, petSchema } from '../create.jsx';
import Input from '../../components/Input.jsx';

export const loader = async ({ params }) => {
  const id = params.petId;
  const pet = await db.pet.findFirst({
    where: {
      id: id,
    },
    include: {
      owner: true,
    },
  });
  return {
    data: pet,
  };
};

export async function action({ params, request }) {
  const id = params.petId;
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries());

  const { error, success, data } = petSchema.safeParse(body);

  if (!success) {
    return {
      errors: error.issues.map((issue) => issue.message),
    };
  }

  const pet = await db.pet.update({
    where: {
      id: id,
    },
    data: data,
  });

  return {
    data: pet,
  };
}

export default function Index() {
  /** @type {Awaited<ReturnType<typeof loader>>} */
  const { data: pet } = useLoaderData();
  const actionData = useActionData();
  const [name, setName] = useState(pet.name);

  function updateName(event) {
    setName(event.target.value);
  }
  const petOptions = petTypes.map((type) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    value: type,
  }));

  return (
    <div>
      <h1>{name || pet.name}</h1>

      {actionData?.errors?.length && (
        <ul>
          {actionData.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <form method="POST">
        <Input
          id="name"
          name="name"
          label="Name"
          value={name}
          onChange={updateName}
        />
        <Input
          id="type"
          name="type"
          label="Type"
          type="select"
          options={['', ...petOptions]}
          defaultValue={pet.type}
          required
        />
        <Input
          id="birthday"
          name="birthday"
          label="Birthday"
          type="date"
          defaultValue={new Date(pet.birthday).toISOString().split('T')[0]}
          required
        />

        <button type="submit">Edit Pet</button>
      </form>

      <form action={`/pet/${pet.id}/delete`} method="POST">
        <button>Delete Pet</button>
      </form>
    </div>
  );
}
