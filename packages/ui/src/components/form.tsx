"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import type { ButtonProps, TextFieldProps } from "@mui/material";
import type { FormEvent, ReactNode } from "react";

interface FormProps {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function FormBase({ children, onSubmit }: FormProps) {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
      {children}
    </Box>
  );
}

/** Baked defaults so pages never repeat fullWidth. */
function Field(props: TextFieldProps) {
  return <TextField fullWidth {...props} />;
}

function Submit({ children, ...props }: ButtonProps) {
  return (
    <Button type="submit" variant="contained" {...props}>
      {children}
    </Button>
  );
}

export const Form = Object.assign(FormBase, { Field, Submit });
