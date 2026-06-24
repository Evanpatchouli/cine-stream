import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#000666",
    },
    secondary: {
      main: "#4355b9",
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#191c1d",
      secondary: "#454652",
    },
    error: {
      main: "#ba1a1a",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: {
      fontSize: 45,
      lineHeight: "52px",
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: 24,
      lineHeight: "32px",
      fontWeight: 600,
      letterSpacing: 0,
    },
    h3: {
      fontSize: 22,
      lineHeight: "28px",
      fontWeight: 500,
      letterSpacing: 0,
    },
    body1: {
      fontSize: 16,
      lineHeight: "24px",
      letterSpacing: 0,
    },
    body2: {
      fontSize: 14,
      lineHeight: "20px",
      letterSpacing: 0,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          "&.Mui-focused": {
            outline: "none",
            boxShadow: "none",
          },
        },
        input: {
          "&:focus": {
            outline: "none",
            boxShadow: "none",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(25, 28, 29, 0.23)",
            borderWidth: 1,
          },
        },
      },
    },
  },
});
