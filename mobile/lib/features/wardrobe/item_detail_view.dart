import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_geometry.dart';
import '../../core/theme/app_typography.dart';
import '../../core/database/app_database.dart';
import '../../shared/components/app_button.dart';
import '../../shared/components/app_card.dart';
import 'wardrobe_bloc.dart';

class ItemDetailView extends StatelessWidget {
  final WardrobeItemModel item;

  const ItemDetailView({Key? key, required this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final costPerWear = item.wearCount > 0 ? (item.purchasePrice / item.wearCount).toStringAsFixed(2) : item.purchasePrice.toStringAsFixed(2);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(item.name, style: AppTypography.h3),
        backgroundColor: colors.background,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppGeometry.screenPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: colors.surfaceSoft,
                  borderRadius: BorderRadius.circular(AppGeometry.radiusCard),
                  border: Border.all(color: colors.border),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.checkroom, size: 64, color: colors.primary),
                      const SizedBox(height: 8),
                      Text(item.name, style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                      Text('${item.subcategory} ? ${item.formality}', style: AppTypography.caption.copyWith(color: colors.textSecondary)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppGeometry.gapLarge),
              Row(
                children: [
                  Expanded(
                    child: AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Wear Count", style: AppTypography.caption.copyWith(color: colors.textMuted)),
                          const SizedBox(height: 4),
                          Text("${item.wearCount} times", style: AppTypography.h2.copyWith(color: colors.textPrimary)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: AppGeometry.gapNormal),
                  Expanded(
                    child: AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Cost / Wear", style: AppTypography.caption.copyWith(color: colors.textMuted)),
                          const SizedBox(height: 4),
                          Text("\$$costPerWear", style: AppTypography.h2.copyWith(color: colors.success)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppGeometry.gapLarge),
              Text("Wear History", style: AppTypography.h3.copyWith(color: colors.textPrimary)),
              const SizedBox(height: AppGeometry.gapNormal),
              AppCard(
                child: Column(
                  children: [
                    _buildHistoryRow("Aug 27", "Business Meeting", colors),
                    const Divider(height: 16),
                    _buildHistoryRow("Aug 20", "Dinner with friends", colors),
                    const Divider(height: 16),
                    _buildHistoryRow("Aug 14", "Office", colors),
                  ],
                ),
              ),
              const SizedBox(height: AppGeometry.gapLarge),
              AppButton(
                label: '+ Mark as Worn Today',
                icon: const Icon(Icons.check, size: 18),
                onPressed: () {
                  context.read<WardrobeBloc>().add(MarkItemAsWornRequested(item.id, "Daily wear"));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('? Marked ${item.name} as worn')),
                  );
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryRow(String date, String contextStr, AppSemanticColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(date, style: AppTypography.label.copyWith(color: colors.textPrimary)),
        Text(contextStr, style: AppTypography.body.copyWith(color: colors.textSecondary)),
      ],
    );
  }
}
