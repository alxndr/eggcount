class Day < ActiveRecord::Base

  validates :count, presence: true
  validates :date, presence: true

end
