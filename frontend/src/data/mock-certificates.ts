export interface Certificate {
  id: string;
  ownerName: string;
  study: string;
  issueDate: string; // YYYY-MM-DD
  status: "invalid" | "valid" | "revoked";
}

// export const mockCertificates: Certificate[] = [
//   {
//     id: "550e8400-e29b-41d4-a716-446655440000",
//     ownerName: "Sarah Johnson",
//     study: "Advanced Web Development",
//     issueDate: "2024-01-15",
//     status: "Valid",
//   },
//   {
//     id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
//     ownerName: "Michael Chen",
//     study: "Data Science Fundamentals",
//     issueDate: "2024-02-20",
//     status: "Valid",
//   },
//   {
//     id: "6ba7b811-9dad-11d1-80b4-00c04fd430c9",
//     ownerName: "Emily Rodriguez",
//     study: "UI/UX Design Principles",
//     issueDate: "2023-12-10",
//     status: "Revoked",
//   },
//   {
//     id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
//     ownerName: "James Williams",
//     study: "Cloud Architecture",
//     issueDate: "2024-03-05",
//     status: "Valid",
//   },
//   {
//     id: "886313e1-3b8a-5372-9b90-0c9aee199e5d",
//     ownerName: "Sophia Anderson",
//     study: "Cybersecurity Essentials",
//     issueDate: "2023-11-28",
//     status: "Valid",
//   },
// ];
