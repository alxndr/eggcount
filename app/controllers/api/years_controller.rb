module Api
  class YearsController < Api::BaseController

    # GET /api/years.json
    def index
      plural_resource_name = '@years'
      resources = Year.find_stuff

      instance_variable_set(plural_resource_name, resources)
      expires_in 5.minutes, public: true
      respond_with instance_variable_get(plural_resource_name)
    end

  end
end
