import { Alert, IconButton, Snackbar } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import React from "react";

export default function Toaster({ message }) {
  const [open, setOpen] = React.useState(true);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
    >
      <Alert 
        onClose={handleClose} 
        severity="warning" 
        sx={{ width: '30vw' }}
        action={
          <IconButton color="inherit" size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
