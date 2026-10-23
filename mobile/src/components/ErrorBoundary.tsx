import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";
import { Button } from "./ui/Button";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Une erreur inattendue s'est produite.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Oups, quelque chose s&apos;est mal passé</Text>
          <Text style={styles.message}>
            L&apos;écran a rencontré une erreur. Vous pouvez réessayer sans quitter
            l&apos;application.
          </Text>
          <Button
            label="Réessayer"
            onPress={() => this.setState({ hasError: false, message: "" })}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: { ...typography.section, color: colors.primary, textAlign: "center" },
  message: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
