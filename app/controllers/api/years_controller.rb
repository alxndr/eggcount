module Api
  class YearsController < ApplicationController

    # GET /api/years.json
    def index
      @years = Year.find_stuff
      # expires_in 2.minutes, public: true # this is for the *browser*'s cache
    end

  end
end
