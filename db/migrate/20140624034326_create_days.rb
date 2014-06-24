class CreateDays < ActiveRecord::Migration
  def change
    create_table :days do |t|
      t.integer :count, null: false, default: 0
      t.date :date, null: false

      t.timestamps
    end
  end
end
