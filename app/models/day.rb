class Day < ActiveRecord::Base

  validates :count, presence: true
  validates :date, presence: true, uniqueness: true

  def calculate_moving_average_days(n) # this should be done in sql
    range_start = (date - n.days)
    return nil unless Day.where('date < ?', range_start).present?
    range_end = date - 1.minute
    days_in_range = Day.where(date: range_start..range_end)
    days_in_range.order(:date).pluck(:count).sum / n.to_f
  end

end
