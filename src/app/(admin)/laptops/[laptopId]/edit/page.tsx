import { EditLaptop } from "../../_components/LaptopFormPages";

type Props = { params: Promise<{ laptopId: string }> };

export const metadata = { title: "Edit Laptop · Laptops" };

export default async function EditLaptopPage({ params }: Props) {
  const { laptopId } = await params;
  return <EditLaptop id={laptopId} />;
}
