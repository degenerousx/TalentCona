// Placeholder records from the design until the users API exists.

export type PaymentMethod = "Direct" | "Loan" | "Fundraising";

export type Student = {
  name: string;
  email: string;
  program: string;
  payment: PaymentMethod;
  amountPaid: number;
  hasLaptop: boolean;
  instructor: string | null;
  advisor: string | null;
  status: "Active";
};

export const STUDENTS: Student[] = [
  { name: "Sarah Johnson", email: "sarah.j@email.com", program: "Frontend Dev & Backend Dev", payment: "Direct", amountPaid: 1400, hasLaptop: true, instructor: "Sarah Johnson", advisor: "Sarah Johnson", status: "Active" },
  { name: "Michael Chen", email: "m.chen@email.com", program: "Data Science", payment: "Loan", amountPaid: 1400, hasLaptop: false, instructor: "Michael Chen", advisor: "Michael Chen", status: "Active" },
  { name: "Adebayo Ojo", email: "adebayo@email.com", program: "Mobile Dev & UI/UX", payment: "Fundraising", amountPaid: 1400, hasLaptop: false, instructor: "Adebayo Ojo", advisor: "Adebayo Ojo", status: "Active" },
  { name: "Emily Rodriguez", email: "emily.r@email.com", program: "Web Development", payment: "Direct", amountPaid: 1400, hasLaptop: true, instructor: "Emily Rodriguez", advisor: "Michael Chen", status: "Active" },
  { name: "David Kim", email: "d.kim@email.com", program: "AI/ML", payment: "Loan", amountPaid: 1400, hasLaptop: true, instructor: null, advisor: null, status: "Active" },
];
