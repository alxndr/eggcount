class AddDateIndexToDays < ActiveRecord::Migration
  def change
    add_index :days, :date, unique: true
  end
end
