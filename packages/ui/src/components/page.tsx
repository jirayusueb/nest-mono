import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

function PageBase({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {children}
    </Container>
  );
}

function Header({ children }: { children: ReactNode }) {
  return <Stack sx={{ mb: 3, gap: 1 }}>{children}</Stack>;
}

function Title({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h4" component="h1">
      {children}
    </Typography>
  );
}

export const Page = Object.assign(PageBase, { Header, Title });
