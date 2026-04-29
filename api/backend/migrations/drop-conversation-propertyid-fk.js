/**
 * Migration: Drop foreign key constraint on conversations.propertyId
 * 
 * Reason: Mock properties don't exist in database tables, so FK constraint
 * prevents creating conversations with mock property UUIDs. Since we use both 
 * real and mock data, we relax this constraint.
 */

module.exports = {
  up: async (QueryInterface, Sequelize) => {
    try {
      // Drop the foreign key constraint if it exists
      await QueryInterface.removeConstraint('conversations', 'conversations_propertyId_fkey', { force: true });
      console.log('✓ Dropped conversations_propertyId_fkey constraint');
    } catch (error) {
      console.log('Note: Could not drop FK constraint (may not exist):', error.message);
    }
  },

  down: async (QueryInterface, Sequelize) => {
    try {
      // Re-add the constraint
      await QueryInterface.addConstraint('conversations', {
        fields: ['propertyId'],
        type: 'foreign key',
        name: 'conversations_propertyId_fkey',
        references: {
          table: 'properties',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('✓ Re-added conversations_propertyId_fkey constraint');
    } catch (error) {
      console.log('Note: Could not re-add FK constraint:', error.message);
    }
  }
};
