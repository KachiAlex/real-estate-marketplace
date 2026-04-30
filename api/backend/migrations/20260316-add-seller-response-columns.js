module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('dispute_resolutions', 'sellerResponse', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Seller written response to dispute'
    });

    await queryInterface.addColumn('dispute_resolutions', 'sellerEvidence', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of seller counter-evidence files'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('dispute_resolutions', 'sellerResponse');
    await queryInterface.removeColumn('dispute_resolutions', 'sellerEvidence');
  }
};
