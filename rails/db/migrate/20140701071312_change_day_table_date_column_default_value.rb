class ChangeDayTableDateColumnDefaultValue < ActiveRecord::Migration
  def change
    change_column :days, :count, :integer, default: nil
  end
end
