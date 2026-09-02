import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/theme/app_theme.dart';
import 'core/network/api_client.dart';
import 'core/sync/sync_engine.dart';
import 'features/auth/auth_bloc.dart';
import 'features/auth/login_view.dart';
import 'features/onboarding/onboarding_view.dart';
import 'features/wardrobe/wardrobe_bloc.dart';
import 'features/shell/app_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final apiClient = ApiClient();
  final syncEngine = SyncEngine(apiClient: apiClient);

  runApp(OmniPresenceApp(
    apiClient: apiClient,
    syncEngine: syncEngine,
  ));
}

class OmniPresenceApp extends StatefulWidget {
  final ApiClient apiClient;
  final SyncEngine syncEngine;

  const OmniPresenceApp({
    Key? key,
    required this.apiClient,
    required this.syncEngine,
  }) : super(key: key);

  @override
  State<OmniPresenceApp> createState() => _OmniPresenceAppState();
}

class _OmniPresenceAppState extends State<OmniPresenceApp> {
  bool _hasCompletedOnboarding = true;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (_) => AuthBloc(apiClient: widget.apiClient)..add(SessionCheckRequested()),
        ),
        BlocProvider<WardrobeBloc>(
          create: (_) => WardrobeBloc(apiClient: widget.apiClient, syncEngine: widget.syncEngine)..add(LoadWardrobeRequested()),
        ),
      ],
      child: MaterialApp(
        title: 'OmniPresence',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is Authenticated) {
              if (!_hasCompletedOnboarding) {
                return OnboardingView(
                  onComplete: () => setState(() => _hasCompletedOnboarding = true),
                );
              }
              return const AppShell();
            }
            return LoginView(
              onNavigateToRegister: () {},
              onLoginSuccess: () => setState(() => _hasCompletedOnboarding = true),
            );
          },
        ),
      ),
    );
  }
}
