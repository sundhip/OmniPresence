import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  static const String defaultBaseUrl = 'http://10.0.2.2:8000/api/v1'; // Android emulator to host
  late final Dio dio;

  ApiClient({String baseUrl = defaultBaseUrl}) {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await SecureStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Log & pass error
        return handler.next(e);
      },
    ));
  }
}
