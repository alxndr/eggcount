class Day < ActiveRecord::Base

  validates :count, presence: true
  validates :date, presence: true, uniqueness: true

  def calculate_moving_average_days(n) # this *could* be done in sql...
    Day.where(date: (date - n.days)..(date - 1.minute)).order(:date).pluck(:count).sum / n.to_f
  end

end
